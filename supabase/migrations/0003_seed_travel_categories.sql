-- Seed SmartTravelHacks public footer categories so posts can be assigned to them.
-- Safe to run repeatedly. If a category already exists with the same slug, it is updated in place.

do $$
declare
  category_record record;
  existing_id text;
begin
  for category_record in
    select * from (values
      ('cat-europe', 'Europe', 'europe', 'where-to-go', 'Travel guides, routes, and budget tips for Europe.'),
      ('cat-southeast-asia', 'Southeast Asia', 'southeast-asia', 'where-to-go', 'Backpacking guides, itineraries, and practical tips for Southeast Asia.'),
      ('cat-central-east-and-south-asia', 'Central, East, and South Asia', 'central-east-and-south-asia', 'where-to-go', 'Guides and travel hacks for Central, East, and South Asia.'),
      ('cat-north-america', 'North America', 'north-america', 'where-to-go', 'Budget travel ideas and destination guides for North America.'),
      ('cat-south-america', 'South America', 'south-america', 'where-to-go', 'Backpacking routes, city guides, and savings tips for South America.'),
      ('cat-central-america', 'Central America', 'central-america', 'where-to-go', 'Travel guides and budget tips for Central America.'),
      ('cat-oceania', 'Oceania', 'oceania', 'where-to-go', 'Travel guides and planning tips for Australia, New Zealand, and the Pacific.'),
      ('cat-africa', 'Africa', 'africa', 'where-to-go', 'Destination guides, safety tips, and travel inspiration for Africa.'),
      ('cat-travel-insurance', 'Travel Insurance', 'travel-insurance', 'plan-your-trip', 'Travel insurance guides, comparisons, and safety advice.'),
      ('cat-the-best-gear', 'The Best Gear', 'the-best-gear', 'plan-your-trip', 'Packing lists, gear reviews, and travel essentials.'),
      ('cat-hostel-life-101', 'Hostel Life 101', 'hostel-life-101', 'plan-your-trip', 'Hostel tips, etiquette, safety, and budget accommodation advice.'),
      ('cat-book-a-hotel', 'Book a Hotel', 'book-a-hotel', 'plan-your-trip', 'Hotel booking tips, deal strategies, and accommodation guides.'),
      ('cat-find-cheap-flights', 'Find Cheap Flights', 'find-cheap-flights', 'plan-your-trip', 'Flight booking strategies, fare alerts, and cheap travel hacks.'),
      ('cat-budget-backpacking', 'Budget Backpacking', 'budget-backpacking', 'plan-your-trip', 'Money-saving guides for backpackers and long-term travelers.'),
      ('cat-travel-tips', 'Travel Tips', 'travel-tips', 'plan-your-trip', 'General travel planning tips, hacks, and practical advice.'),
      ('cat-best-travel-jobs', 'Best Travel Jobs', 'best-travel-jobs', 'plan-your-trip', 'Remote work, travel jobs, and ways to earn while traveling.')
    ) as seed(id, name, slug, category_group, description)
  loop
    select c.id into existing_id
    from public.categories c
    where c.slug = category_record.slug or c.id = category_record.id
    limit 1;

    if existing_id is null then
      insert into public.categories (id, data)
      values (
        category_record.id,
        jsonb_build_object(
          'id', category_record.id,
          'name', category_record.name,
          'slug', category_record.slug,
          'group', category_record.category_group,
          'description', category_record.description,
          'created_at', now(),
          'updated_at', now()
        )
      );
    else
      update public.categories
      set data = data || jsonb_build_object(
          'id', existing_id,
          'name', category_record.name,
          'slug', category_record.slug,
          'group', category_record.category_group,
          'description', category_record.description,
          'updated_at', now()
        ),
        updated_at = now()
      where id = existing_id;
    end if;
  end loop;
end $$;
